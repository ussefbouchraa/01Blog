// Purpose: Post list component.
// Displays all posts/feed posts in a list format with preview, likes, and comments count.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule],
  template: '<h2>PostList</h2>',
  styles: []
})
export class PostListComponent {

}
