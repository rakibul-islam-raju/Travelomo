"use client";

import Image from "next/image";

// Import Swiper React components
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
// Import custom styles
import "./index.css";

export default function Slider() {
	return (
		<>
			<Swiper
				spaceBetween={50}
				slidesPerView={1}
				onSlideChange={() => console.log("slide change")}
				onSwiper={(swiper) => console.log(swiper)}
				pagination={{ clickable: true }}
				modules={[Pagination, Autoplay]}
				autoplay={{
					delay: 2500,
					disableOnInteraction: false,
				}}
			>
				{Array.from({ length: 5 }).map((_, index) => (
					<SwiperSlide key={index}>
						<Image
							src={`https://picsum.photos/1000/500?${index}`}
							alt="slider"
							width={1000}
							height={500}
							className="w-full h-full object-cover rounded"
						/>
					</SwiperSlide>
				))}
			</Swiper>
		</>
	);
}
