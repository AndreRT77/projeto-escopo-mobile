import { Text as RNText, TextProps } from 'react-native'

export function Text({
  className,
  ...props
}: TextProps & {
  className?: string
}) {
  return <RNText className={`font-inter ${className ?? ''}`} {...props} />
}
