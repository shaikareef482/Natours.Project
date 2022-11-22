import axios from 'axios';
import { showAlert } from './alerts';
const stripe = require(pk_test_51M5uZHSAujaM4reJxamAF04SmiS7hacc8QNDo9n07wjo5jihuW8teH4YiKPKwx5MGUnknjjlDFhKB44jhkkncAAA00VPDUhxOl);

export const bookTour  =  async tourId =>{
 
try{
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`)

    await stripe.redirectToCheckout({
       sessionId : session.data.session.id 
    })
}catch(err)
{
    console.log(err);

    showAlert('error',err);
}  
}