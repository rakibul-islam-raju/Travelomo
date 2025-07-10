type Props = {
	actualPrice: number;
	discountPrice?: number;
};

export const EventPriceWithDiscount: React.FC<Props> = ({
	actualPrice,
	discountPrice,
}) => {
	const hasDiscount = discountPrice && discountPrice < actualPrice;

	return (
		<>
			{hasDiscount ? (
				<span>
					<span className="line-through mr-2 text-destructive">
						৳{actualPrice}
					</span>
					<span className="text-primary font-medium">৳{discountPrice}</span>
				</span>
			) : (
				<span>৳{actualPrice}</span>
			)}
		</>
	);
};
