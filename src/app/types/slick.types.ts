export interface SlickResponsiveSetting {
  breakpoint: number;
  settings: SlickConfig | 'unslick';
}

export interface SlickConfig {
  accessibility?: boolean;
  adaptiveHeight?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
  arrows?: boolean;
  asNavFor?: string | null;
  appendArrows?: string;
  appendDots?: string;
  prevArrow?: string | object;
  nextArrow?: string | object;
  centerMode?: boolean;
  centerPadding?: string;
  cssEase?: string;
  customPaging?: (slider: unknown, i: number) => string;
  dots?: boolean;
  dotsClass?: string;
  draggable?: boolean;
  fade?: boolean;
  focusOnSelect?: boolean;
  easing?: string;
  edgeFriction?: number;
  infinite?: boolean;
  initialSlide?: number;
  lazyLoad?: 'ondemand' | 'progressive';
  mobileFirst?: boolean;
  pauseOnFocus?: boolean;
  pauseOnHover?: boolean;
  pauseOnDotsHover?: boolean;
  respondTo?: 'window' | 'slider' | 'min';
  responsive?: SlickResponsiveSetting[];
  rows?: number;
  slide?: string;
  slidesPerRow?: number;
  slidesToShow?: number;
  slidesToScroll?: number;
  speed?: number;
  swipe?: boolean;
  swipeToSlide?: boolean;
  touchMove?: boolean;
  touchThreshold?: number;
  useCSS?: boolean;
  useTransform?: boolean;
  variableWidth?: boolean;
  vertical?: boolean;
  verticalSwiping?: boolean;
  rtl?: boolean;
  waitForAnimate?: boolean;
  zIndex?: number;
}
