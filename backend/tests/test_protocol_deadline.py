"""A slow HTTPS receiver must not retain a sender or authorization locks forever."""
import socket
import ssl
import threading
import time
from datetime import UTC, datetime, timedelta

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


@pytest.mark.parametrize('phase', ['response_headers', 'tls_handshake', 'normal_response'])
def test_pinned_https_deadline_closes_real_tls_socket(tmp_path, monkeypatch, phase):
    from app.services import protocol_webhooks as service

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'hooks.example.test')])
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name)
            .public_key(key.public_key()).serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now(UTC)-timedelta(minutes=1))
            .not_valid_after(datetime.now(UTC)+timedelta(hours=1))
            .add_extension(x509.SubjectAlternativeName([x509.DNSName('hooks.example.test')]), critical=False)
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .sign(key, hashes.SHA256()))
    certificate = tmp_path/'receiver.pem'
    private_key = tmp_path/'receiver-key.pem'
    certificate.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    private_key.write_bytes(key.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    server_context.load_cert_chain(str(certificate), str(private_key))
    trusted_context = ssl.create_default_context(cafile=str(certificate))
    original_socket = socket.socket
    listener = original_socket()
    listener.bind(('127.0.0.1', 0))
    listener.listen(1)
    listener.settimeout(1)
    local_address = listener.getsockname()
    closed, received = [], []
    finished = threading.Event()

    class LocalSocket(original_socket):
        def connect(self, address):
            # Exercise real TCP/TLS, while keeping every test byte on loopback.
            return super().connect(local_address if address == ('93.184.216.34', 443) else address)

    def receiver():
        connection = None
        try:
            connection, _ = listener.accept()
            connection.settimeout(1)
            if phase == 'tls_handshake':
                time.sleep(0.4)
            connection = server_context.wrap_socket(connection, server_side=True)
            request = b''
            while b'\r\n\r\n' not in request:
                part = connection.recv(65536)
                if not part:
                    raise ConnectionResetError('Sender closed before HTTP headers')
                request += part
            headers, body = request.split(b'\r\n\r\n', 1)
            length = next((int(line.split(b':', 1)[1]) for line in headers.split(b'\r\n')
                           if line.lower().startswith(b'content-length:')), 0)
            while len(body) < length:
                part = connection.recv(65536)
                if not part:
                    raise ConnectionResetError('Sender closed before HTTP body')
                body += part
            received.append(request)
            connection.sendall(b'HTTP/1.1 204 No Content\r\n')
            if phase == 'response_headers':
                # Each gap is shorter than the socket timeout, but the total is not.
                for _ in range(12):
                    time.sleep(0.035)
                    connection.sendall(b'X-Trickle: alive\r\n')
            connection.sendall(b'\r\n')
        except (OSError, ssl.SSLError):
            closed.append(True)
        finally:
            if connection:
                connection.close()
            listener.close()
            finished.set()

    thread = threading.Thread(target=receiver, daemon=True)
    thread.start()
    monkeypatch.setattr(service.socket, 'socket', LocalSocket)
    monkeypatch.setattr(service.ssl, 'create_default_context', lambda: trusted_context)
    monkeypatch.setattr(service, 'REQUEST_TIMEOUT_SECONDS', 0.15, raising=False)
    started = time.monotonic()
    try:
        if phase == 'normal_response':
            assert service._post_pinned('https://hooks.example.test/events', '93.184.216.34', b'{}', {}) == 204
        else:
            with pytest.raises(TimeoutError):
                service._post_pinned('https://hooks.example.test/events', '93.184.216.34', b'{}', {})
        assert time.monotonic()-started < 0.35
        assert finished.wait(0.7), 'The receiver must observe a physically closed connection'
        if phase == 'normal_response':
            assert received and not closed
        else:
            assert closed, 'Cancelling an await alone must not leave its TLS connection running'
        if phase == 'tls_handshake':
            assert received == [], 'A timed-out handshake must never send the HTTP request'
    finally:
        thread.join(timeout=1)
