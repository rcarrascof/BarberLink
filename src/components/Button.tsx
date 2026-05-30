import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      case 'primary':
      case 'secondary':
      case 'danger':
      default:
        return styles.textSolid;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.button, getButtonStyle(), disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#10b981' : '#ffffff'} />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#10b981', // Emerald green
  },
  secondary: {
    backgroundColor: '#27272a', // Zinc-800
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  textSolid: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#10b981',
  },
});
