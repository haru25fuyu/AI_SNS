export const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  // FirebaseのTimestampオブジェクトをDateに変換
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
