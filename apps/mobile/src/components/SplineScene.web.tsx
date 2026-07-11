import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export function SplineScene({ url }: { url: string }) {
  useEffect(() => {
    // Inject the Spline viewer script dynamically if not already present
    const scriptId = 'spline-viewer-script';
    if (typeof document !== 'undefined' && !document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.12.95/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {React.createElement('spline-viewer', { url, style: { width: '100%', height: '100%' } })}
    </View>
  );
}
