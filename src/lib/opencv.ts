let runtime: Promise<any> | undefined;

export function getOpenCv(): Promise<any> {
  if (runtime) return runtime;
  runtime = import("@techstark/opencv-js")
    .then((module) => {
      let timer: number | undefined;
      return new Promise((resolve, reject) => {
        timer = window.setTimeout(() => reject(new Error("OpenCV 初始化超时")), 60000);
        // OpenCV 5 导出 Promise；旧版导出实例或等待 onRuntimeInitialized。
        Promise.resolve(module.default ?? module)
          .then((cv: any) => {
            if (cv?.Mat) resolve(cv);
            else cv.onRuntimeInitialized = () => resolve(cv);
          })
          .catch(reject);
      }).finally(() => window.clearTimeout(timer));
    })
    .catch((error) => {
      runtime = undefined;
      throw error;
    });
  return runtime;
}
