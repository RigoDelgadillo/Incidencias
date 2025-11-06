import Drawer from 'expo-router/drawer';
import React from 'react';
import { Text, View } from 'react-native';

const CustomHeaderTitle = () => (
  <View>
    <Text className= "text-primary text-2xl font-Inter-Bold">Lista Incidencias</Text>
  </View>
);

const UserLayout = () => {
  return (
    <Drawer>
      <Drawer.Screen 
        name="index" 
        options={{ 
          drawerLabel: "Inicio",
          headerTitle: () => <CustomHeaderTitle />,
          headerShown: true
        }}
      />
    </Drawer>
  )
}

export default UserLayout