import axios from 'axios'
import { showAlert } from './alerts';

 export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email: email,
        password: password
      }
      
    })
    console.log(`=========>${res}`)

    if (res.data.status === 'success') {
      showAlert('success','You are successfully logged in ')
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }
  } catch (err) {
    showAlert('error',err.response.data.message)
  }
};


export const logout = async()=>{
  try{
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    })
    if (res.data.status === 'success') location.reload(true)

  }catch(err){
    showAlert('error', 'Error logging out')
  }
}