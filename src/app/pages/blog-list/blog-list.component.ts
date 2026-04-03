import { Component, OnInit } from '@angular/core';
import { WordpressService } from '../../services/wordpress.service';
import { PostSimpleCard } from '../../types/wordpress.types';
import { SharedDataService } from '../../services/shared-data.service';
import { DatePipe } from '@angular/common';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';

@Component({
  selector: 'app-blog-list',
  imports: [ScrollRevealDirective],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss'
})
export class BlogListComponent implements OnInit {
  constructor(
    private wp: WordpressService,
    private shared: SharedDataService,
    private date: DatePipe,
    private meta: MetaHandlerService
  ) {}
  posts: PostSimpleCard[] = [];
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Blog',
      description: 'Explora guías, consejos y noticias de viaje en el blog de Xplora Travel.',
      image: '/assets/img/blog/1.png'
    });
    this.shared.setLoading(true);
    this.shared.changeHeaderType("dark");
    this.wp.getSimplePostCards({}).subscribe(posts=>{
      this.posts = posts.map(post=>{
        return {
          ...post,
          date: this.date.transform(post.date, 'mediumDate') || ''
        }
      });
      this.shared.setLoading(false);
    });
  }
}
