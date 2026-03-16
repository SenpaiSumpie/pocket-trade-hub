import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

interface ExportRendererProps {
  children: ReactNode;
  width?: number;
}

/**
 * Renders children offscreen for capture by react-native-view-shot.
 * Uses absolute positioning (NOT display:none) so RN actually renders content.
 * Fixed width ensures consistent export resolution regardless of device.
 */
const ExportRenderer = forwardRef<View, ExportRendererProps>(
  ({ children, width = 1080 }, ref) => {
    return (
      <View style={styles.offscreen} pointerEvents="none">
        <View
          ref={ref}
          style={[styles.captureTarget, { width }]}
          collapsable={false}
        >
          {children}
        </View>
      </View>
    );
  },
);

ExportRenderer.displayName = 'ExportRenderer';

export { ExportRenderer };

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    overflow: 'hidden',
  },
  captureTarget: {
    backgroundColor: '#0f0f1a',
  },
});
