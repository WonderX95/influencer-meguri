'use client'
import CasePage from "@/features/projects/pages/company/case";
import { useRecoilValue } from "recoil";
import { authUserState } from "@/recoil/atom/auth/authUserAtom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";


function Case() {
  const authUser = useRecoilValue(authUserState);
  const id = authUser?.user?.id;
  const router = useRouter();
  const [payment, setPayment] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      const { data } = await axios.get(`/api/company/aCompany/getPayment?id=${id}`)
      if (!(data.data?.freeAccount === 0 || data.data?.freeAccount === false)) {
        setPayment(data.data?.payment);
      } else {
        setPayment(data.data?.payment);
      }
      if (data.data?.thisMonthCollectionCnt > 0 && (data.data?.thisMonthCollectionCnt >= data.data?.monthlyCollectionCnt)) {
        setExpired(true);
      }
      if (data && (data.data?.freeAccount === 0 || data.data?.freeAccount === false)) {
        setPayment(data.data?.payment);
        const paymentInfo = new Date(data.data?.payment);
        const today = new Date(data.todayString);
        const payed = paymentInfo > today;
        if (!payed) {
          router.push('/paymentRequire');
        }
      }
    }
    fetchPaymentInfo();
  }, [])

  return (
    <div >
      <CasePage payment={payment} expired={expired} />
    </div>
  );
}
export default Case;

