import { Component } from "react";
import { StyleSheet, SafeAreaView, AppState } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { Asset, useAssets } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useState } from "react";
import { width } from "@mui/system";

class MyWeb extends Component {
  private webview: any = null;
  constructor(props) {
    super(props);
    this.state = {
      copy: null,
      appState: AppState.currentState,
      lan: props.devIP,
      loading: true,
    };
  }

  reload() {
    this.setState({ loading: true, display: null }, () => {
      console.log("reload?");
      this.lan && this.lan.reload();
      this.wan && this.wan.reload();
    });
  }

  inject() {
    this.wan && this.wan.injectJavaScript(`${this.state.copy};true;`);
    this.lan && this.lan.injectJavaScript(`${this.state.copy};true;`);
  }

  componentDidMount() {
    this.fetchLocalFile();
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        let inject = false;
        console.log("nextAppState", nextAppState, this.state.appState);
        if (
          this.state.appState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          inject = true;
        }
        this.setState({ appState: nextAppState }, () => {
          if (inject) {
            console.log("re-injecting client", !!this.wan, !!this.lan);
            this.inject();
          }
        });
      }
    );
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      console.log("NetInfo", state);
      let reload = false;

      if (this.state.net && this.state.net !== state.ipAddress) {
        reload = true;
      }
      this.setState(
        {
          net: state.ipAddress,
        },
        () => {
          if (reload) {
            console.log("do reload");
            this.reload();
          }
        }
      );
    });

    AsyncStorage.getItem("addresses")
      .then((r) => {
        throw new Error();
        const routes = JSON.parse(r);
        routes.lan = routes.lan.trim();
        this.setState(routes);
      })
      .catch((e) => {
        // this.setState({
        //   lan: this.props.devIP,
        // });
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
              <WebView
                style={
                  this.state.display === "wan"
                    ? styles.container
                    : styles.hidden
                }
                onRenderProcessGone={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView Crashed: ", nativeEvent.didCrash);
                }}
                containerStyle={
                  this.state.display === "wan"
                    ? styles.container
                    : styles.hidden
                }
                key={"wanwebview"}
                ref={(ref) => {
                  console.log(
                    "make ref wan",
                    this.state.wan,
                    this.state.display
                  );
                  this.wan = ref;
                }}
                scalesPageToFit={false}
                source={{
                  uri:
                    "http://" +
                    this.state.wan +
                    ":9090/harness/cinny/?expo=true",
                }}
                onError={(e) => {
                  console.log("error", e);
                }}
                onLoad={() => {
                  console.log("display", this.state.display);
                  this.wan.injectJavaScript(`${this.state.copy};true;`);
                  if (this.state.loading) {
                    this.setState({ loading: false, display: "wan" });
                  }
                }}
                onMessage={(e) => {
                  console.log("addresses", e.nativeEvent.data);
                  AsyncStorage.setItem("addresses", e.nativeEvent.data);
                  const json = JSON.parse(e.nativeEvent.data);
                  json.lan = json.lan.trim();
                  console.log("setJSON", json);
                  if (this.state.wan !== json.wan) {
                    this.setState({ wan: json.wan });
                  }
                }}
                onContentProcessDidTerminate={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn(
                    "Content process terminated, reloading",
                    nativeEvent
                  );
                  // this.refs.webview.reload();
                }}
              />
            ) : null}
            {this.state.lan ? (
              <WebView
                style={
                  this.state.display === "lan"
                    ? styles.container
                    : styles.hidden
                }
                onRenderProcessGone={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView Crashed: ", nativeEvent.didCrash);
                }}
                onContentProcessDidTerminate={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn(
                    "Content process terminated, reloading",
                    nativeEvent
                  );
                  // this.refs.webview.reload();
                }}
                containerStyle={
                  this.state.display === "lan"
                    ? styles.container
                    : styles.hidden
                }
                key={"lanwebview"}
                ref={(ref) => {
                  console.log("make ref lan", !!ref);
                  this.lan = ref;
                }}
                source={{
                  uri: "http://" + this.state.lan + "/harness/cinny/?expo=true",
                }}
                onError={(e) => {
                  console.log("error", e);
                }}
                onLoad={() => {
                  console.log(
                    "load lan",
                    this.state.lan,
                    this.state.loading,
                    !!this.lan,
                    this.state.display
                  );
                  this.lan.injectJavaScript(`${this.state.copy};true;`);
                }}
                onMessage={(e) => {
                  console.log("addresses", e.nativeEvent.data);
                  AsyncStorage.setItem("addresses", e.nativeEvent.data);
                  const json = JSON.parse(e.nativeEvent.data);
                  json.lan = json.lan.trim();
                  console.log("setJSON", json);
                  if (this.state.wan !== json.wan) {
                    this.setState({ wan: json.wan });
                  }
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
  devIP: "setup.local",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  hidden: {
    display: "none",
    flex: 0,
    height: "0%",
    width: "0%",
  },
});
