import won from "../../app/won-es6.js";
import { details } from "../detail-definitions.js";
import { is } from "../../app/utils.js";

export const industryDetail = {
  ...details.tags,
  identifier: "industry",
  label: "Industries and Fields",
  placeholder: "e.g. construction, graphic design, metal industry, etc",
  icon: "#TODO", //TODO proper icon
  parseToRDF: function({ value }) {
    if (!value) {
      return { "s:industry": undefined };
    } else {
      return { "s:industry": value };
    }
  },
  parseFromRDF: function(jsonLDImm) {
    return won.parseListFrom(jsonLDImm, ["s:industry"], "xsd:string");
  },
};

export const employmentTypesDetail = {
  ...details.tags,
  identifier: "employmentTypes",
  label: "Employment Types",
  placeholder: "e.g. full-time, part-time, internship, self-employed, etc",
  // icon: "#ico36_detail_tags", //TODO proper icon
  icon: "#TODO", //TODO proper icon
  parseToRDF: function({ value }) {
    if (!value) {
      return { "s:employmentType": undefined };
    } else {
      return { "s:employmentType": value };
    }
  },
  parseFromRDF: function(jsonLDImm) {
    return won.parseListFrom(jsonLDImm, ["s:employmentType"], "xsd:string");
  },
};

export const organizationNamesDetail = {
  ...details.tags,
  identifier: "organizationNames",
  label: "Organization Names",
  placeholder:
    "e.g. Shiawase Corp., Simmerling Constructions, Daily Bugle, etc",
  // icon: "#ico36_detail_tags", //TODO proper icon
  icon: "#TODO", //TODO proper icon
  parseToRDF: function({ value }) {
    if (!value) {
      return { "s:hiringOrganization": undefined };
    } else {
      return {
        "s:hiringOrganization": value.map(industry => ({
          // for ppl who only want offers from a specific organization (rather niche tho)
          "@type": "s:Organization",
          "s:name": industry, // JSON - company
        })),
      };
    }
  },
  parseFromRDF: function(jsonLDImm) {
    return won.parseListFrom(
      jsonLDImm,
      ["s:hiringOrganization", "s:name"],
      "xsd:string"
    );
  },
  generateHumanReadable: function({ value, includeLabel }) {
    if (value && is("Array", value) && value.length > 0) {
      const prefix = includeLabel ? this.label + ": " : "";
      //   const industryNames = value.map(industry => )
      return prefix + value.join(", ");
    } else {
      return undefined;
    }
  },
};

/**
 * For the job-offering side we only need one organization name
 */
export const organizationNameDetail = {
  identifier: "organizationName",
  label: "Organization Name",
  // icon: "#ico36_detail_tags", //TODO proper icon
  icon: "#TODO", //TODO proper icon
  placeholder: 'e.g. "Simmerling Constructions"',
  component: "won-title-picker",
  viewerComponent: "won-title-viewer",
  parseToRDF: function({ value }) {
    if (!value) {
      return { "s:hiringOrganization": undefined };
    } else {
      return {
        "s:hiringOrganization": {
          "@type": "s:Organization",
          "s:name": value, // JSON - company
        },
      };
    }
  },
  parseFromRDF: function(jsonLDImm) {
    return won.parseFrom(
      jsonLDImm,
      ["s:hiringOrganization", "s:name"],
      "xsd:string"
    );
  },
  generateHumanReadable: function({ value, includeLabel }) {
    if (value) {
      return includeLabel ? this.label + ": " + value : value;
    }
    return undefined;
  },
};

/*
    "s:hiringOrganization": { // for ppl who only want offers from a specific organization (rather niche tho)
      "@type": "s:Organization",
      "s:name": "", // JSON - company
    },
    */
