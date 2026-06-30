const getPlainTextLength = (value?: string) => {
  if (!value) return 0;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = value;
  const plainText = tempDiv.innerText || tempDiv.textContent || "";
  return plainText.replaceAll(/\s+/g, " ").trim().length;
};

const createMaxRichTextValidator = (max: number) => {
  return (_: unknown, value: string): Promise<void> => {
    if (!value) return Promise.resolve();
    const length = getPlainTextLength(value);
    if (length > max) {
      return Promise.reject(new Error(`Maximum ${max} characters allowed`));
    }
    return Promise.resolve();
  };
};

const maxRichText1000Validator = createMaxRichTextValidator(1000);

export { createMaxRichTextValidator, getPlainTextLength, maxRichText1000Validator };
