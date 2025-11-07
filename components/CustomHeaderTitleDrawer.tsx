import { Text, View } from 'react-native';

interface Props {
  title: string;
}
const CustomHeaderTitleDrawer = ({title} : Props) => {
  return (
    <View>
      <Text className="text-primary text-2xl font-Inter-Bold">{title}</Text>
    </View>
  )
}

export default CustomHeaderTitleDrawer