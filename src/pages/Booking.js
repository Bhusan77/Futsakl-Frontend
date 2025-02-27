import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Booking.css";
import Loader from "../components/Loader/Loader";
import Error from "../components/Error/Error";
import moment from "moment";
import Swal from "sweetalert2";

const Booking = () => {
    // Destructure 'date' instead of startDate and endDate
    const { courtId, date } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();
    const [court, setCourt] = useState();
    const [totalAmount, setTotalAmount] = useState(0);
    const [dummyQR, setDummyQR] = useState(null);
    const [bookingId, setBookingId] = useState(null);

    // Use the single date parameter
    const bookingDate = moment(date, 'DD-MM-YYYY HH:mm');
    const displayDate = bookingDate.format('dddd, DD-MM-YYYY, hh:mm A');

    // Helper to normalize a court from backend data.
    const normalizeCourt = (court) => {
        const id = court.id || court._id || court.ID || court.courtId;
        if (!id) {
            console.error("Court id not found in response:", court);
        }
        return {
            ...court,
            _id: id, // use the first found id
            imgURLs: Array.isArray(court.imgurls)
                ? court.imgurls
                : (court.imgurls ? JSON.parse(court.imgurls) : []),
            currentBookings: Array.isArray(court.currentbookings)
                ? court.currentbookings
                : (court.currentbookings ? JSON.parse(court.currentbookings) : [])
        }
    };

    const currentUser = localStorage.getItem("currentUser")
        ? JSON.parse(localStorage.getItem("currentUser"))
        : null;

    useEffect(() => {
        if (!localStorage.getItem("currentUser")) {
            Swal.fire({
                title: 'Error',
                text: 'Please Login as a user',
                icon: 'error',
                confirmButtonText: 'Close',
                willClose: () => {
                    window.location.href = "/login";
                }
            });
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/courts/getCourtById`, { courtId });
                if (response.status !== 200) {
                    throw new Error('Network response was not OK');
                }
                const normalizedCourt = normalizeCourt(response.data);
                setCourt(normalizedCourt);
                // Calculate total amount based on your pricing logic if needed
                setTotalAmount(Number(normalizedCourt.price));
                setIsLoading(false);
            } catch (error) {
                setError(true);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courtId]);

    async function payNow() {
        const formattedDate = moment(date, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss');

        // Ensure that the court state is available.
        if (!court) {
            Swal.fire({
                title: 'Error',
                text: 'Court details not loaded',
                icon: 'error',
                confirmButtonText: 'Close'
            });
            return;
        }

        // Build a minimal court object.
        const minimalCourt = {
            _id: court._id || courtId,
            name: court.name || "Default Court Name"
        };

        // Pass a plain string for courtName and the needed fields only.
        const bookingDetails = {
            courtName: minimalCourt.name,
            courtId: minimalCourt._id,
            userId: currentUser._id,
            date: formattedDate,
            maxPlayers: court.maxPlayers,
            totalAmount
        };

        try {
            setIsLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/bookingCourt`, bookingDetails);
            setIsLoading(false);
            setDummyQR(response.data.dummyQR);
            setBookingId(response.data.bookingId);
            Swal.fire({
                title: 'QR Code Generated',
                text: 'Please scan the QR code and press Confirm Payment once paid.',
                icon: 'info',
                confirmButtonText: 'OK'
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error in booking',
                icon: 'error',
                confirmButtonText: 'Close'
            });
            console.error('Error booking court:', error.response.data);
        }
    }

    async function confirmPayment() {
        try {
            setIsLoading(true);
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/confirmPayment`, { bookingId, courtId });
            setIsLoading(false);
            Swal.fire({
                title: 'Successful',
                text: 'Your booking has been confirmed!',
                icon: 'success',
                confirmButtonText: 'Close'
            }).then(() => {
                window.location.href = "/profile";
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error in confirming payment',
                icon: 'error',
                confirmButtonText: 'Close'
            });
            console.error('Error confirming booking:', error.response.data);
        }
    }

    return (
        <div className="m-5">
            {isLoading ? (<h1 className="loading-text"><Loader /></h1>) : court ? (
                <div className="row payment-row">
                    <div className="col-md-5">
                        <h1>{court.name}</h1>
                        <hr />
                        <img src={court.imgURLs[1]} className="small-img" alt="Court" />
                        <p>Location : {court.location}</p>
                    </div>
                    <div className="col-md-5">
                        <div className="payment-section">
                            <h1>Booking Details</h1>
                            <hr />
                            <b>
                                <p>Name : {currentUser && currentUser.name ? currentUser.name : "Guest"}</p>
                                <p>Date : {displayDate}</p>
                                <p>Max Players : {court.maxPlayers} people</p>
                                <p className="p-text">{court.description}</p>
                            </b>
                        </div>
                        <div className="payment-section">
                            <b>
                                <h1>Amount</h1>
                                <hr />
                                <p>Total Amount : ${totalAmount}</p>
                            </b>
                        </div>
                        <div className="btn-area">
                            {!dummyQR ? (
                                <button className="btn btn-primary" onClick={payNow}>Generate QR Code</button>
                            ) : (
                                <>
                                    <div>
                                        <p>Scan this QR code:</p>
                                        <img src={dummyQR} alt="QR Code" style={{ width: '200px' }} />
                                    </div>
                                    <button className="btn btn-success m-2" onClick={confirmPayment}>Confirm Payment</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (<Error />)}
        </div>
    );
};

export default Booking;