import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRating } from '@/src/hooks/useRating';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  proposalId: string;
  partnerName: string;
}

const STAR_COUNT = 5;

export function RatingModal({ visible, onClose, proposalId, partnerName }: RatingModalProps) {
  const [selectedStars, setSelectedStars] = useState(0);
  const { submitRating, submitting } = useRating();

  const handleSubmit = useCallback(async () => {
    if (selectedStars < 1) return;
    const success = await submitRating(proposalId, selectedStars);
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Rating submitted',
        text2: `You rated ${partnerName} ${selectedStars} star${selectedStars !== 1 ? 's' : ''}.`,
        visibilityTime: 3000,
      });
    }
    setSelectedStars(0);
    onClose();
  }, [selectedStars, proposalId, partnerName, submitRating, onClose]);

  const handleSkip = useCallback(() => {
    setSelectedStars(0);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.heading}>Rate your trade</Text>
          <Text style={styles.subheading}>
            How was your trade with {partnerName}?
          </Text>

          {/* Star row */}
          <View style={styles.starRow}>
            {Array.from({ length: STAR_COUNT }, (_, i) => {
              const starIndex = i + 1;
              const filled = starIndex <= selectedStars;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedStars(starIndex)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={40}
                    color={filled ? '#f0c040' : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.submitButton, selectedStars < 1 && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={selectedStars < 1 || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  heading: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  starTouch: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
