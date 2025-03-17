import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51OV8DpHeC7VfJv8UJXLcBhECs81qBUSwD7ZJQmNuFtbien8WQCuZ2SCzkOYu2siAwkH1x4GqvCPUJqOVXQULsoz200ctmm80cL');

interface priceProps {
    priceID: string;
    paymentCnt: number;
}

const CheckoutPage = ({ priceID, paymentCnt }: priceProps) => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleClick = async () => {
            setIsLoading(true);
            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{
                    price: 'price_1PNVNXHeC7VfJv8UvM1qCdsO',
                    quantity: 1,
                }],
                mode: 'subscription',
                successUrl: `${window.location.origin}/paymentConfirm`,
                cancelUrl: `${window.location.origin}/companyInfo?type=fail`,
            }
            );
            if (error) {
                console.error('Error:', error);
            }
        };

        document.querySelector('#checkoutButton').addEventListener('click', handleClick);
    }, [priceID]);

    return (
        <div className='pb-[5px]'>
            <div>
                お支払いページに移行しますか？
            </div>
            <button id="checkoutButton" className='flex items-center m-auto my-[20px] px-[20px] py-[10px] rounded-[5px] text-[white] bg-[#3F8DEB] hover:bg-[#2e6fbe] hover:shadow-lg duration-500 '>
                <img
                    src="/img/refresh.svg"
                    alt="rotate"
                    className={isLoading ? "mr-[5px] rotate" : "mr-[5px] hidden"}
                />
                確認</button>
        </div>
    );
};

export default CheckoutPage;