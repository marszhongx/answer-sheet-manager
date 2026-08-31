let runtime: Promise<any> | undefined;

export function getOpenCv(): Promise<any> {
  if (runtime) return runtime;
  runtime = import("@techstark/opencv-js")
    .then(
      (module) =>
        new Promise((resolve, reject) => {
          const cv = (module.default ?? module) as any;
          if (cv?.Mat) {
            resolve(cv);
            return;
          }
          const timer = window.setTimeout(() => reject(new Error("OpenCV 初始化超时")), 60000);
          cv.onRuntimeInitialized = () => {
            window.clearTimeout(timer);
            resolve(cv);
          };
        }),
    )
    .catch((error) => {
      runtime = undefined;
      throw error;
    });
  return runtime;
}
