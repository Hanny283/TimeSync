import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { Colors } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  leftIcon,
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], sizeStyles[size], style]}
      {...props}
    >
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={size === 'sm' ? 14 : size === 'lg' ? 20 : 17}
          color={variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? '#FFFFFF' : Colors.textPrimary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, textStyles[variant], textSizeStyles[size]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
  primary: {
    backgroundColor: Colors.blue,
  },
  secondary: {
    backgroundColor: '#3F3F46',
    borderWidth: 1,
    borderColor: '#52525B',
  },
  danger: {
    backgroundColor: Colors.red,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 12, paddingVertical: 7 },
  md: { paddingHorizontal: 20, paddingVertical: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 15 },
});

const textStyles = StyleSheet.create({
  primary: { color: '#FFFFFF' },
  secondary: { color: Colors.textPrimary },
  danger: { color: '#FFFFFF' },
  ghost: { color: Colors.textPrimary },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 16 },
  lg: { fontSize: 17 },
});
