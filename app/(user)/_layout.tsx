import Drawer from 'expo-router/drawer';
import React from 'react';
import { Text, View } from 'react-native';

import CustomButton from '@/components/CustomButton';
import { supabase } from '@/utils/supabase';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';

const CustomHeaderTitle = () => (
  <View>
    <Text className= "text-primary text-2xl font-Inter-Bold">Lista Incidencias</Text>
  </View>
);

const CustomDrawerContent = (props : DrawerContentComponentProps) => (
  <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
    <DrawerItemList {...props} />
      <View className= 'mt-auto p-4'>
        <CustomButton
        label="Cerrar sesión"
        color="bg-red-500"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
        />
      </View>
  </DrawerContentScrollView>
);

const UserLayout = () => {
  return (
    <Drawer drawerContent={CustomDrawerContent}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Inicio",
          headerTitle: () => <CustomHeaderTitle />,
          headerShown: true,
        }}
      />
    </Drawer>
  )
}

export default UserLayout