import { ViewStyle, TextStyle } from 'react-native';

export const remToPx = (rem: number): number => rem * 16;

export const containerStyles: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: remToPx(2),
  paddingVertical: remToPx(2),
  display: 'flex',
};

export const baseTextStyles: TextStyle = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: remToPx(1),
  marginBottom: remToPx(1),
};

export const headerStyles: TextStyle = {
  ...baseTextStyles,
  fontSize: remToPx(1.8),
};

export const subheaderStyles: TextStyle = {
  ...baseTextStyles,
  fontSize: remToPx(1.2),
};

export const buttonStyles: ViewStyle = {
  borderColor: '#c3c3c4',
  borderWidth: 1,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'white',
  marginBottom: remToPx(1),
  paddingVertical: remToPx(0.6),
  paddingHorizontal: remToPx(1),
  borderRadius: 4,
};

export const disabledButtonStyles: ViewStyle = {
  ...buttonStyles,
  opacity: 0.5,
};

export const buttonTextStyles: TextStyle = {
  ...baseTextStyles,
  marginBottom: 0,
  fontSize: remToPx(1.2),
};
