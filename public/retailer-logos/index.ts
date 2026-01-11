// Import all retailer logos
import albertHeijnLogo from './albert_heijn_logo.png';
import jumboLogo from './jumbo_logo.png';
import logoAldi from './logo_aldi.png';
import logoBioCompany from './logo_biocompany.png';
import logoDenns from './logo_denns.png';
import logoEdeka from './logo_edeka.png';
import logoKaufland from './logo_kaufland.png';
import logoNetto from './logo_netto.png';
import logoPlus from './logo_plus.png';
import pennyLogo from './penny_logo.svg';
import reweLogo from './rewe_logo.png';

// Export as a mapping object
export const retailerLogos: Record<string, string> = {
  'Albert Heijn': albertHeijnLogo,
  'Jumbo': jumboLogo,
  'Aldi': logoAldi,
  'BioCompany': logoBioCompany,
  'Denns': logoDenns,
  'Edeka': logoEdeka,
  'Kaufland': logoKaufland,
  'Netto': logoNetto,
  'Plus': logoPlus,
  'Penny': pennyLogo,
  'Rewe': reweLogo,
};
