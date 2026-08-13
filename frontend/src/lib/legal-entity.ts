/**
 * Legal identity of the entity publishing TaskMatch.ai.
 *
 * Every legal page reads its entity facts from here, so a registration number
 * lives in exactly one place and can never drift between the mentions légales,
 * the privacy policy and the terms.
 *
 * Fields left `null` are **not yet supplied**. They render as an explicit
 * "being registered / to be completed" notice rather than a plausible-looking
 * value: French law (LCEN art. 6 III-1) requires these details to be accurate,
 * and a wrong SIREN in a mandatory notice is worse than an acknowledged gap.
 * Fill them in and the pages update themselves — do not hardcode them in JSX.
 */

export interface LegalEntity {
  /** Commercial name shown to users. */
  name: string;
  /** Legal form — e.g. "SAS", "SARL", "SASU", "Entreprise individuelle". */
  legalForm: string | null;
  /** Share capital in euros, as a number. Null for forms that have none. */
  shareCapital: number | null;
  /** 9-digit SIREN, digits only. */
  siren: string | null;
  /** 14-digit SIRET of the registered office, digits only. */
  siret: string | null;
  /** City of the Registre du Commerce et des Sociétés. */
  rcsCity: string | null;
  /** Intra-community VAT number, e.g. "FR XX 123456789". */
  vatNumber: string | null;
  /** Registered office, one line per row. */
  address: string[] | null;
  country: string;
  /** Directeur de la publication — required by LCEN. */
  publicationDirector: string;
  email: {
    legal: string;
    privacy: string;
    security: string;
  };
  /**
   * Hosting providers. LCEN art. 6 III-1 requires the host's name, address and
   * phone number to be reachable from the site. Where the serving chain has
   * more than one provider, each is listed with the role it plays — a visitor
   * (or a regulator) needs to know who actually holds the data as opposed to
   * who terminates the connection.
   */
  hosts: HostingProvider[];
}

export interface HostingProvider {
  name: string;
  /** Translation key describing what this provider does in the chain. */
  role: "infrastructure" | "proxy";
  address: string[];
  /** Null when the provider publishes no phone number for this purpose. */
  phone: string | null;
  website: string | null;
  /** Company registration, e.g. "RCS Lille Métropole 424 761 419". */
  registration: string | null;
}

export const LEGAL_ENTITY: LegalEntity = {
  name: "Tauraco",

  // -- Registration --------------------------------------------------------
  // Identifiers below are taken from the public registry (Annuaire des
  // Entreprises / INSEE Sirene, SIREN 879 829 646, dirigeant Sega Diarrah).
  //
  // `legalForm` and `shareCapital` are the two values that the registry had not
  // yet reflected when this was written: it still showed "SARL" at a capital of
  // 100 €, last updated 12/08/2026, while the company has converted to a SAS
  // with a capital of 100 000 €. They are recorded here from the Kbis.
  // Re-check them against the registry once the change has propagated — a
  // legal notice that contradicts the public register is the first thing a
  // counterparty's diligence flags.
  legalForm: "SAS",
  shareCapital: 100_000,
  siren: "879829646",
  siret: "87982964600014",
  // Corbeil-Essonnes falls under the Tribunal de commerce d'Évry.
  rcsCity: "Évry",
  vatNumber: "FR 28 879 829 646",
  address: ["59 boulevard Jean Jaurès", "91100 Corbeil-Essonnes"],

  country: "France",
  publicationDirector: "Sega Diarrah",

  // TODO(legal): a holding company is being formed. When it is registered and
  // TaskMatch is transferred to it, the publisher named on every legal page
  // changes — update this record rather than the pages, and re-issue the
  // Data Processing Agreements, since the data controller changes with it.

  email: {
    legal: "legal@tauraco.ai",
    privacy: "privacy@tauraco.ai",
    security: "security@tauraco.ai",
  },

  // Application and data sit on AWS; OVHcloud fronts it with the proxy layer.
  // Both are named because LCEN asks who hosts the content, and answering with
  // only the edge would point at the wrong company.
  hosts: [
    {
      name: "Amazon Web Services EMEA SARL",
      role: "infrastructure",
      address: ["38 avenue John F. Kennedy", "L-1855 Luxembourg", "Luxembourg"],
      // AWS publishes no general telephone number for this purpose; stating one
      // we cannot stand behind would be worse than omitting it.
      phone: null,
      website: "https://aws.amazon.com",
      registration: "RCS Luxembourg B 186284",
    },
    {
      name: "OVH SAS (OVHcloud)",
      role: "proxy",
      address: ["2 rue Kellermann", "59100 Roubaix", "France"],
      phone: "1007",
      website: "https://www.ovhcloud.com",
      registration: "RCS Lille Métropole 424 761 419",
    },
  ],
};

/** Whether the registration details are complete enough to display. */
export function isRegistrationPublished(entity: LegalEntity = LEGAL_ENTITY): boolean {
  return Boolean(entity.siren && entity.rcsCity && entity.address?.length);
}

/** Whether any hosting provider is documented well enough to display. */
export function isHostPublished(entity: LegalEntity = LEGAL_ENTITY): boolean {
  return entity.hosts.some((host) => host.name && host.address.length > 0);
}

/**
 * One-line identification of the publisher, e.g.
 * "Tauraco, SAS au capital de 10 000 €, RCS Paris 123 456 789".
 *
 * Returns just the name while the registration details are outstanding, so the
 * sentence stays true rather than half-filled.
 */
export function publisherLine(entity: LegalEntity = LEGAL_ENTITY): string {
  const parts: string[] = [entity.name];
  if (entity.legalForm) {
    parts.push(
      entity.shareCapital != null
        ? `${entity.legalForm} au capital de ${formatCapital(entity.shareCapital)}`
        : entity.legalForm,
    );
  }
  if (entity.rcsCity && entity.siren) {
    parts.push(`RCS ${entity.rcsCity} ${formatSiren(entity.siren)}`);
  }
  if (entity.country) {
    parts.push(entity.country);
  }
  return parts.join(", ");
}

/** French convention: SIREN in three groups of three digits. */
export function formatSiren(siren: string): string {
  const digits = siren.replace(/\D/g, "");
  return digits.length === 9 ? digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : siren;
}

/** French convention: SIRET as SIREN plus the five-digit establishment number. */
export function formatSiret(siret: string): string {
  const digits = siret.replace(/\D/g, "");
  return digits.length === 14
    ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4")
    : siret;
}

function formatCapital(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} €`;
}
