import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

export default function App({ devIP }) {
  return (
    <WebView
      style={styles.container}
      source={{ uri: `http://${devIP}` }}
      onMessage={(e) => {}}
    />
  );
}

App.defaultProps = {
  devIP: Constants?.manifest?.extra?.devIP || "setup.local",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
