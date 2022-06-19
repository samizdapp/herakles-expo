import { Component } from "react";
import { StyleSheet, SafeAreaView, AppState } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { Asset, useAssets } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";

class MyWeb extends Component {
  private webview: any = null;
  constructor(props) {
    super(props);
    this.state = {
      copy: null,
      appState: AppState.currentState,
    };
  }

  componentDidMount() {
    this.fetchLocalFile();
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          this.state.appState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("reload webview");
          this.webview.reload();
        }
        this.setState({ appState: nextAppState });
      }
    );
  }

  componentWillUnmount() {
    this.appStateSubscription.remove();
  }

  fetchLocalFile = async () => {
    let file = Asset.fromModule(require("./assets/fetch.inject.txt"));
    // await file.downloadAsync(); // Optional, saves file into cache
    file = await fetch(file.uri);
    file = await file.text();
    this.setState({ copy: file });
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {this.state.copy ? (
          <WebView
            ref={(ref) => (this.webview = ref)}
            source={{
              uri: `http://${this.props.devIP}/harness/cinny/?expo=true`,
            }}
            scalesPageToFit={false}
            // scrollEnabled={false}
            onLoadEnd={() => {
              console.log("LOADEND");
              this.webview.injectJavaScript(`${this.state.copy};true;`);
            }}
            onMessage={(e) => {
              console.log("got message", e.nativeEvent.data);
              AsyncStorage.setItem("addresses", e.nativeEvent.data);
              // s.onMessage(e.nativeEvent.data, (res) => {
              //   this.webview.injectJavaScript(
              //     `window.postMessage(\`${JSON.stringify(res)}\`);true;`
              //   );
              // });
            }}
          />
        ) : null}
      </SafeAreaView>
    );
  }
}

export default MyWeb;

MyWeb.defaultProps = {
  devIP: Constants?.manifest?.extra?.devIP || "setup.local",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
