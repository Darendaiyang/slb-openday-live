/**
 * 由 Firebase 控制台「项目设置 → 常规 → 你的应用」中的配置填入。
 * 请勿把含密钥的截图发到公开网络；客户端 apiKey 可出现在网页中，安全主要靠 Firestore 规则。
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBUPknJOP6PNYuy6Q3fs1o_NWeah6ZK3H4",
  authDomain: "slb-open-day.firebaseapp.com",
  projectId: "slb-open-day",
  storageBucket: "slb-open-day.appspot.com",
  messagingSenderId: "9382087884",
  appId: "1:9382087884:web:3c454b153910969ee18669",
  measurementId: "G-X0T93J7X7L",
};

export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "REPLACE_ME" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "REPLACE_ME"
  );
}
