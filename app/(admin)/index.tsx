import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const indexAdmin = () => {
  return (
    <View>
      <Text>Admin</Text>

      <Pressable onPress={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}>
              <Text>Cerrar sesión</Text>
            </Pressable>
    </View>
  )
}

export default indexAdmin