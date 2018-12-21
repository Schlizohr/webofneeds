/**
 * Created by fsuda on 18.09.2018.
 */

import { phdOffer } from "./uc-phd-offer.js";
import { phdSearch } from "./uc-phd-search.js";
import { postdocOffer } from "./uc-postdoc-offer.js";
import { postdocSearch } from "./uc-postdoc-search.js";
import { consortiumSearch } from "./uc-consortium-search.js";
import { consortiumOffer } from "./uc-consortium-offer.js";

export const professionalGroup = {
  identifier: "professionalgroup",
  label: "Professional Networking",
  icon: undefined,
  useCases: {
    phdOffer: phdOffer,
    phdSearch: phdSearch,
    postdocOffer: postdocOffer,
    postdocSearch: postdocSearch,
    consortiumOffer: consortiumOffer,
    consortiumSearch: consortiumSearch,
  },
};
