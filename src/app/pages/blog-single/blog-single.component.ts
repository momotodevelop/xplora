import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WordpressService } from '../../services/wordpress.service';
import { SharedDataService } from '../../services/shared-data.service';
import { PostDetail } from '../../types/wordpress.types';
import { DatePipe } from '@angular/common';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';

@Component({
  selector: 'app-blog-single',
  imports: [ScrollRevealDirective],
  templateUrl: './blog-single.component.html',
  styleUrl: './blog-single.component.scss'
})
export class BlogSingleComponent implements OnInit{
  constructor(
    private route: ActivatedRoute, 
    private wp: WordpressService, 
    private shared: SharedDataService,
    private date: DatePipe,
    private meta: MetaHandlerService
  ){}
  post?: PostDetail;
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Blog',
      description: 'Lee artículos, guías y recomendaciones de viaje en el blog de Xplora Travel.',
      image: '/assets/img/blog/1.png'
    });
    this.shared.changeHeaderType("dark");
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.wp.getPostDetail(id).subscribe({
        next: post => {
          const cleanExcerpt = this.stripHtml(post.excerpt || '').slice(0, 180);
          this.meta.setMeta({
            title: `Xplora Travel || ${post.title}`,
            description: cleanExcerpt || 'Descubre este artículo del blog de Xplora Travel con ideas y recomendaciones para tu próximo viaje.',
            image: post.featuredMediaUrl
          });
          this.post = {
            ...post,
            date: this.date.transform(post.date, 'longDate') || ''
          };
        },
        error: () => {
          this.post = undefined;
        }
      });
    });
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
