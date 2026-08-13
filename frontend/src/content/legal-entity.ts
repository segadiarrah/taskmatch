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
   * Hosting provider. LCEN requires the host's name, address and phone number
   * to be reachable from the site.
   */
  host: {
    name: string | null;
    address: string[] | null;
    phone: string | null;
    website: string | null;
  };
}

export const LEGAL_ENTITY: LegalEntity = {
  name: "Tauraco",

  // -- Registration --------------------------------------------------------
  // TODO(legal): supply from the Kbis. Until then the pages say so plainly.
  legalForm: null,
  shareCapital: null,
  siren: null,
  siret: null,
  rcsCity: null,
  vatNumber: null,
  address: null,

  country: "France",
  publicationDirector: "Sega Diarrah",

  email: {
    legal: "legal@tauraco.ai",
    privacy: "privacy@tauraco.ai",
    security: "security@tauraco.ai",
  },

  // TODO(legal): identify the actual hosting provider of the production
  // deployment and supply its postal address and phone number.
  host: {
    name: null,
    address: null,
    phone: null,
    website: null,
  },
};

/** Whether the registration details are complete enough to display. */
export function isRegistrationPublished(entity: LegalEntity = LEGAL_ENTITY): boolean {
  return Boolean(entity.siren && entity.rcsCity && entity.address?.length);
}

/** Whether the hosting details are complete enough to display. */
export function isHostPublished(entity: LegalEntity = LEGAL_ENTITY): boolean {
  return Boolean(entity.host.name && entity.host.address?.length);
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

function formatCapital(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} €`;
}
