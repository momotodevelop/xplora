import { Component, OnInit } from '@angular/core';
import { WordpressService } from '../../../services/wordpress.service';
import { PostSimpleCard } from '../../../types/wordpress.types';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-inspiration',
  standalone: false,
  templateUrl: './inspiration.component.html',
  styleUrl: './inspiration.component.scss',
  providers: [DatePipe]
})
export class InspirationComponent implements OnInit {
  constructor(private wp: WordpressService, private date: DatePipe){}
  posts: PostSimpleCard[] = []; 
  ngOnInit(): void {
    this.wp.getSimplePostCards({page: 1, per_page: 3}).subscribe(posts=>{
      //console.log(posts[0].date);
      this.posts = posts.map(post=>{
        return {
          ...post,
          date: this.date.transform(post.date, 'mediumDate') || ''
        }
      });
    });
  }
}
