/**
 * 复制本文件为 firebase-config.js，把下方内容换成 Firebase 控制台「项目设置 → 你的应用」里的配置。
 * firebase-config.js 可提交到私有仓库；公开仓库亦可（客户端配置本身可公开，安全靠 Firestore 规则）。
 */
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc",
};

export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("REPLACE") &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "your-project-id"
  );
}
