import React, { useEffect, useState } from 'react'
import "./Home.css";
import Court from "../components/Court/Court";
import Loader from "../components/Loader/Loader";
import { DatePicker } from 'antd';
import Swal from 'sweetalert2'
import { Link } from 'react-router-dom';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const Home = () => {
    // State management
    const [courts, setCourts] = useState([]); // The original list of courts fetched from the API
    const [IsLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();

    const [date, setDate] = useState(null);

    const [searchCourt, setSearchCourt] = useState("");
    const [typeCourt, setTypeCourt] = useState("all");

    const [filteredCourts, setFilteredCourts] = useState([]); // This is used to store the list of courts that match the search and type filters

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/courts/getAllCourts`);
                const data = await response.json();

                // Ensure data is an array, otherwise fallback to an empty array
                const courtsArray = Array.isArray(data)
                    ? data.map(court => ({
                        ...court,
                        _id: court.id, // alias id as _id for frontend components if needed
                        imgURLs: Array.isArray(court.imgurls)
                            ? court.imgurls // already an array
                            : (court.imgurls ? JSON.parse(court.imgurls) : []),
                        currentBookings: Array.isArray(court.currentbookings)
                            ? court.currentbookings // already an array
                            : (court.currentbookings ? JSON.parse(court.currentbookings) : [])
                    }))
                    : [];

                setCourts(courtsArray);
                setFilteredCourts(courtsArray);
                setIsLoading(false);
            } catch (error) {
                setError(true);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    function onDateChange(value, dateString) {
        console.log("Selected date:", dateString);
        setDate(dateString);
    }

    const disabledDate = (current) => {
        // Can not select days before yesterday and today
        return current && current < dayjs().tz('Pacific/Auckland').subtract(1, 'day').endOf('day');
    };

    function disabledHours() {
        let hours = [];
        for (let i = 0; i < 10; i++) {
            hours.push(i);
        }
        for (let i = 22; i < 24; i++) {
            hours.push(i);
        }
        return hours;
    }

    function disabledMinutes() {
        let minutes = [];
        for (let i = 1; i < 60; i++) {
            if (i % 30 !== 0) {
                minutes.push(i);
            }
        }
        return minutes;
    }

    // Search
    function filterBySearch() {
        let availableCourts = [...courts];

        const filteredCourts = availableCourts.filter(
            (court) => court.name.toLowerCase().includes(searchCourt.toLowerCase())
        );

        setFilteredCourts(filteredCourts);
    }

    // Type
    function filterByType(event) {
        setTypeCourt(event);

        let availableCourts = [...courts];

        if (event !== "all") {
            const filteredCourts = availableCourts.filter(
                (court) => court.type.toLowerCase() === event.toLowerCase()
            );
            setFilteredCourts(filteredCourts);
        }
        else {
            setFilteredCourts(courts);
        }
    }


    return (
        <div className="container">
            <div className="row main-row mt-5 bs">
                <div className="col-md-4">
                    <DatePicker
                        showTime={{ format: 'HH:mm' }}
                        format="DD-MM-YYYY HH:mm"
                        disabledDate={disabledDate}
                        onChange={onDateChange}
                    />
                </div>

                <div className="col-md-5">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search Courts"
                        value={searchCourt}
                        onChange={(event) => { setSearchCourt(event.target.value) }}
                        onKeyUp={filterBySearch}
                    />
                </div>

                <div className="col-md-2">
                    <select
                        value={typeCourt}
                        onChange={(event) => { filterByType(event.target.value) }}
                    >
                        <option value="all">All</option>
                        <option value="indoor">Futsal</option>
                        <option value="outdoor">Cricksal</option>
                    </select>
                </div>
            </div>

            <div className="row main-row mt-5">
                {IsLoading ? (
                    <h1 className="loading-text">Courts Fetching...<Loader /></h1>
                ) : filteredCourts.length === 0 ? (
                    <h1 className="loading-text">No courts available</h1>
                ) : (
                    filteredCourts.map((court, index) => {
                        return (
                            <div key={index} className="col-md-9 mt-3">
                                <Court court={court} date={date} />
                                <Link to={date ? `/book/${court._id}/${date}` : '#'} onClick={(e) => {
                                    if (!date) {
                                        e.preventDefault();
                                        Swal.fire({
                                            title: 'Sorry!',
                                            text: 'Please select a date and time range first.',
                                            icon: 'error',
                                            confirmButtonText: 'Close'
                                        });
                                    }
                                }}>
                                    {/* <button className="btn btn-primary m-2">Book Now</button> */}
                                </Link>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}

export default Home;