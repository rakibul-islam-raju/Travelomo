"use client";

import Image from "next/image";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
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
							className="w-full h-full object-cover"
						/>
					</SwiperSlide>
				))}
			</Swiper>
		</>
	);
}
