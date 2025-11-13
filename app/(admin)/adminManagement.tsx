import { Link } from 'expo-router'
import { Image, Text, View } from 'react-native'

const adminManagement = () => {
  return (
    <View className='flex-1 justify-center items-center'>

      <Link 
        className='p-10 max-w-80 rounded-xl shadow-xl bg-white border-2 border-slate-300'
        href={'/CRUDusuarios'}
      >
        <View className='flex flex-col justify-center items-center'>
          <Image  source={require('../../assets/images/UsersIcon.png')} />
          <Text 
            className='font-Inter-Bold text-xl mt-4'
          >Gestion Usuarios</Text>
        </View>
        
      </Link>
      
    </View>
  )
}

export default adminManagement