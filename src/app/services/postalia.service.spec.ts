import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PostaliaService } from './postalia.service';
import { environment } from '../../environments/environment';

describe('PostaliaService', () => {
  let service: PostaliaService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PostaliaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PostaliaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should request the postal code through the server-side proxy', () => {
    service.getPostalCode('01000').subscribe();

    const request = httpTesting.expectOne(
      `${environment.postaliaApiUrl}?postalCode=01000`
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({
      codigo_postal: '01000',
      estado: 'Ciudad de México',
      municipio: 'Álvaro Obregón',
      ciudad: 'Ciudad de México',
      zona: 'Urbano',
      colonias: []
    });
  });
});
