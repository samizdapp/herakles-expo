import { Component } from "react";
import { StyleSheet, SafeAreaView, AppState } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { Asset, useAssets } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useState } from "react";

const WrappedWebView = ({ onMessage, address, refFN, onLoad, display }) => {
  // const [view, setView] = useState(null)
  return display ? (
    <WebView
      ref={refFN}
      key={address}
      style={display ? {} : { display: "none", height: 0 }}
      source={{
        uri: `${address}/harness/cinny/?expo=true`,
      }}
      scalesPageToFit={false}
      onLoad={onLoad}
      onMessage={onMessage}
    />
  ) : null;
};
class MyWeb extends Component {
  private webview: any = null;
  constructor(props) {
    super(props);
    this.state = {
      copy: null,
      appState: AppState.currentState,
    };
  }

  reload() {
    this.setState({ loading: true, display: null }, () => {
      this.lan && this.lan.reload();
      this.wan && this.wan.reload();
    });
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
          this.reload();
        }
        this.setState({ appState: nextAppState });
      }
    );
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      this.reload();
    });

    AsyncStorage.getItem("addresses")
      .then((r) => {
        const routes = JSON.parse(r);
        routes.lan = routes.lan.trim();
        this.setState(routes);
      })
      .catch((e) => {
        this.setState({
          lan: this.props.devIP,
        });
      });
  }

  componentWillUnmount() {
    this.appStateSubscription.remove();
    this.unsubscribeNetInfo();
  }

  fetchLocalFile = async () => {
    let file = Asset.fromModule(require("./assets/fetch.inject.txt"));
    // await file.downloadAsync(); // Optional, saves file into cache
    file = await fetch(file.uri);
    file = await file.text();
    this.setState({ copy: file });
  };

  render() {
    console.log("state", this.state.lan);
    return (
      <SafeAreaView style={styles.container}>
        {this.state.copy ? (
          <>
            {this.state.wan ? (
              <WrappedWebView
                display={this.state.loading || this.state.display === this.wan}
                refFN={(ref) => {
                  console.log("make ref", ref);
                  this.wan = ref;
                }}
                address={
                  "http://" + this.state.wan + ":8080/harness/cinny/?expo=true"
                }
                onLoad={() => {
                  this.wan.injectJavaScript(`${this.state.copy};true;`);
                  this.state.loading &&
                    this.setState({ loading: false, display: this.wan });
                }}
                onMessage={(e) => {
                  AsyncStorage.setItem("addresses", e.nativeEvent.data);
                  const json = JSON.parse(e.nativeEvent.data);
                  json.lan = json.lan.trim();
                  this.setState(json);
                }}
              />
            ) : null}
            {this.state.lan ? (
              <WrappedWebView
                display={this.state.loading || this.state.display === this.lan}
                refFN={(ref) => {
                  console.log("make ref", ref);
                  this.lan = ref;
                }}
                style={styles.container}
                address={
                  "http://" + this.state.lan + "/harness/cinny/?expo=true"
                }
                onLoad={() => {
                  console.log("load lan", this.lan);
                  this.lan.injectJavaScript(`${this.state.copy};true;`);
                  this.state.loading &&
                    this.setState({ loading: false, display: this.lan });
                }}
                onMessage={(e) => {
                  AsyncStorage.setItem("addresses", e.nativeEvent.data);
                  const json = JSON.parse(e.nativeEvent.data);
                  json.lan = json.lan.trim();
                  this.setState(json);
                }}
              />
            ) : null}
          </>
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
