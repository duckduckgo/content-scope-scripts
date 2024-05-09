import text from "../../text_1.json";
console.log(text)
const t = (string, val) => {
    return string.replace(/%s/, val)
}
export function useTranslation() {
    return {
      /**
       * @parma {string} identifier
       * @parma {any} vals
       */
      translate: (identifier, val) => {
          const lookup = text[identifier];
          if (!lookup) return identifier;
          if (!lookup) return identifier;
          if (!('text' in lookup)) return identifier;
          return lookup.text.replace("%s", val);
      },
    };
}
