import React, { useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  BackHandler,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SITE_URL = 'https://buysial.com';
const LAUNCHER_SOURCE = require('./assets/splash-icon.png');

function AppShell() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const insets = useSafeAreaInsets();

  const nativeInsetsScript = `
    (function() {
      try {
        var root = document.documentElement;
        root.style.setProperty('--native-safe-area-top', '${Math.round(insets.top)}px');
        root.style.setProperty('--native-safe-area-right', '${Math.round(insets.right)}px');
        root.style.setProperty('--native-safe-area-bottom', '${Math.round(insets.bottom)}px');
        root.style.setProperty('--native-safe-area-left', '${Math.round(insets.left)}px');
        document.body && document.body.classList.add('native-webview-shell');
      } catch (e) {}
      true;
    })();
  `;

  // Handle Android hardware back button
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [canGoBack]);

  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    try {
      webViewRef.current?.injectJavaScript(nativeInsetsScript);
    } catch {}
    SplashScreen.hideAsync().catch(() => {});
  }, [nativeInsetsScript]);

  const onError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {hasError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={styles.errorTitle}>No Connection</Text>
          <Text style={styles.errorMsg}>Please check your internet and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ uri: SITE_URL }}
        style={hasError ? styles.hidden : styles.webview}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onHttpError={onError}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={nativeInsetsScript}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        )}
      />

      {isLoading && !hasError && (
        <View style={styles.splash}>
          <Image source={LAUNCHER_SOURCE} style={styles.splashLogo} resizeMode="contain" />
          <Text style={styles.splashTitle}>Buysial</Text>
          <Text style={styles.splashSub}>Shopping, refined.</Text>
          <ActivityIndicator size="small" color="#f97316" style={{ marginTop: 18 }} />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  hidden: {
    flex: 0,
    height: 0,
    opacity: 0,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogo: {
    width: 168,
    height: 168,
    marginBottom: 18,
  },
  splashTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  splashSub: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  errorWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: '#f97316',
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
