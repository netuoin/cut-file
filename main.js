import { cutFile } from "./cutFile.js";

const inputFile = document.querySelector('input[type="file"]');

inputFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const chunks = await cutFile(file);
  console.log(chunks);
});
