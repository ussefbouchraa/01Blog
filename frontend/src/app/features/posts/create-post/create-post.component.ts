// Purpose: Create post page component.
// Allows authenticated user to create new post with text, image/video upload and validation.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule],
  template: '<h2>CreatePost</h2>',
  styles: []
})
export class CreatePostComponent {

}
