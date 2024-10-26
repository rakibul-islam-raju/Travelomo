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

import { image2, image3, image4 } from "@/assets/images";

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
				<SwiperSlide>
					<div className="relative">
						<Image
							src={image2}
							alt="slider"
							width={500}
							height={600}
							className="w-full h-[600px] object-cover rounded"
						/>
					</div>
				</SwiperSlide>
				<SwiperSlide>
					<div className="relative">
						<Image
							src={image3}
							alt="slider"
							width={500}
							height={600}
							className="w-full h-[600px] object-cover rounded"
						/>
					</div>
				</SwiperSlide>
				<SwiperSlide>
					<div className="relative">
						<Image
							src={image4}
							alt="slider"
							width={500}
							height={600}
							className="w-full h-[600px] object-cover rounded"
						/>
					</div>
				</SwiperSlide>
			</Swiper>
		</>
	);
}
