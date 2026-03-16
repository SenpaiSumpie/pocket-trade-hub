import { useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { View } from 'react-native';

export function useImageExport() {
  const viewRef = useRef<View>(null);
  const [exporting, setExporting] = useState(false);

  const exportAndShare = useCallback(
    async (dialogTitle = 'Share Image') => {
      if (!viewRef.current) return;

      setExporting(true);
      try {
        const uri = await captureRef(viewRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        await Sharing.shareAsync('file://' + uri, {
          mimeType: 'image/png',
          dialogTitle,
        });
      } catch (error) {
        Alert.alert(
          'Export Failed',
          'Could not create or share the image. Please try again.',
        );
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  return { viewRef, exportAndShare, exporting };
}
