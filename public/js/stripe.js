import axios from "axios"
import { showAlert } from './alerts';


const stripe = Stripe('pk_test_51O9uI6SGyWFek6jP1SSc4g3m6KdqUjnY946EVaKGlXEhvxSdhnHwV4Z0yhRdW4ETuUWzY5XQMmUOqPBAiAlHDQX50080wQgoQW')

export const bookTour = async tourId => {
  // 1) Get checkout session from API 
  try{
  const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tour.id}`)
console.log(session)

//2) Create checkout form + charge credit card
await stripe.redirectToCheckout({
  sessionId: session.data.session.id
})

}catch(err){
  console.log(err)
  showAlert('error',err)
}
}