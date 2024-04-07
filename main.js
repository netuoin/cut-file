import { cutFile } from "./cutFile.js";

const inputFile = document.querySelector('input[type="file"]');

inputFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const chunks = await cutFile(file);
  console.log(chunks);

  // 批量发起请求
  const requests = chunks.map((chunk, index) => {
    const formData = new FormData();
    formData.append("chunk", chunk.blob);
    formData.append("filename", file.name);
    formData.append("index", index);
    formData.append("total", chunks.length);
    formData.append("hash", chunk.hash);

    return fetch("http://192.168.2.197:48081/admin-api/infra/file/upload", {
      method: "POST",
      body: formData,
    });
  });

  // 检查状态，如果有失败的请求，重新发起请求
  const checkUploadStatus = async () => {
    const failChunks = chunks.filter((chunk) => chunk.status === "fail");
    if (failChunks.length > 0) {
      await Promise.all(
        failChunks.map(async (chunk) => {
          const formData = new FormData();
          formData.append("chunk", chunk.blob);
          formData.append("filename", file.name);
          formData.append("index", chunk.index);
          formData.append("total", chunks.length);
          formData.append("hash", chunk.hash);

          return fetch(
            "http://192.168.2.197:48081/admin-api/infra/file/upload",
            {
              method: "POST",
              body: formData,
            }
          );
        })
      );
      await checkUploadStatus();
    }
  };

  // 进度条
  let loaded = 0;
  const total = requests.length;
  requests.forEach(async (request, index) => {
    try {
      await request;
      loaded++;
      chunks[index].status = "success";
    } catch (error) {
      console.error(error);
      chunks[index].status = "fail";
    } finally {
      console.log(`上传进度：${loaded}/${total}`);
      await checkUploadStatus();
    }
  });

  // 等待所有请求完成
  await Promise.all(requests);
});
