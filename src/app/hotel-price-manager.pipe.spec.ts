import { HotelPriceManagerPipe } from './hotel-price-manager.pipe';

describe('HotelPriceManagerPipe', () => {
  it('create an instance', () => {
    const pipe = new HotelPriceManagerPipe();
    expect(pipe).toBeTruthy();
  });
});
