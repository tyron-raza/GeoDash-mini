from OpenGL.GL import *
from OpenGL.GLU import *
from OpenGL.GLUT import *
import sys, random
WINDOW_X = 800
WINDOW_Y = 600

show_start_screen = True

game_paused = False
game_over = False
click = False
score = 0
high_score= 0
count = 0

def draw_text_centered(text, x, y, color=(1.0, 1.0, 1.0)):
    glColor3f(*color)
    length = len(text) * 9  
    glRasterPos2f(x - length // 2, y)
    for char in text:
        glutBitmapCharacter(GLUT_BITMAP_TIMES_ROMAN_24, ord(char))

def display_start_screen():
    glClearColor(0.0, 0.0, 0.0, 0.0)  
    glClear(GL_COLOR_BUFFER_BIT)
    draw_text_centered("Geo Dash-Mini", 400, 410, color=(1.0, 1.0, 0.0))

    button_color = (0.0, 1.0, 0.0)
    button_x1, button_y1 = 350, 280
    button_x2, button_y2 = 450, 320
    glColor3f(*button_color)
    glBegin(GL_POINTS)
    for x in range(button_x1, button_x2 + 1):
        for y in range(button_y1, button_y2 + 1):
            glVertex2f(x, y)
    glEnd()

    draw_text_centered("Play", (button_x1 + button_x2) // 2, (button_y1 + button_y2) // 2 - 5, color=(0.0, 0.0, 0.0))
    draw_top_play_symbol(400, 340)

    glutSwapBuffers()

def draw_top_play_symbol(x, y):
    color = (0.0, 1.0, 0.0)
    MidpointLine(x - 10, y, x - 10, y + 50, color) 
    MidpointLine(x + 30, y + 25, x - 10, y + 50, color)  
    MidpointLine(x + 30, y + 25, x - 10, y, color)  

def mouse_click_start_screen(button, state, x, y):
    global show_start_screen

    if button == GLUT_LEFT_BUTTON and state == GLUT_DOWN:
        opengl_x = x
        opengl_y = WINDOW_Y - y

        if 350 <= opengl_x <= 450 and 280 <= opengl_y <= 320:
            show_start_screen = False
            glutDisplayFunc(display)
            glutMouseFunc(mouseClick)
            glutPostRedisplay()
            
ground_y = 200
ceiling_y = 400
block_width = 80  # Enlarged width
block_height = 50  # Enlarged height
triangle_base = 80  # Enlarged base
triangle_height = 60  # Enlarged height
block_speed = 1  # Initial speed
speed_increment = 0.0001  # Incremental speed increase per frame
max_speed = 10  # Maximum allowed speed

# Minimum gap between blocks/triangles
min_gap = 120

# Block and triangle limits
max_blocks = 2
max_triangles = 2

# List to store blocks and triangles
blocks = []
triangles = []

class Block:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = block_width
        self.height = block_height
        self.passed = False 

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.width < 0

    def draw(self):
    # Draw the glow effect
        self.draw_glow()
    # Draw the actual block using GL_POINTS
        glColor3f(0.5, 0.2, 0.8)  # Original block color
        glBegin(GL_POINTS)
        for x in range(int(self.x), int(self.x + self.width) + 1):
           for y in range(int(self.y), int(self.y + self.height) + 1):
              glVertex2f(x, y)
        glEnd()

    def draw_glow(self):
        # Draw multiple transparent layers to simulate a glow effect
        for i in range(1, 9):  # Increase the range for a larger glow
            alpha = 0.5 * (6 - i)  # Decrease alpha for outer layers
            scale = 1.0 + 0.7 * i  # Increase size for outer layers
            glColor4f(0.8, 0.2, 0.8, alpha)  # Pinkish glow with transparency
            glow_x1 = int(self.x - scale)
            glow_y1 = int(self.y - scale)
            glow_x2 = int(self.x + self.width + scale)
            glow_y2 = int(self.y + self.height + scale)

        # Draw the glow layer using GL_POINTS
            glBegin(GL_POINTS)
            for x in range(glow_x1, glow_x2 + 1):
               for y in range(glow_y1, glow_y2 + 1):
                  glVertex2f(x, y)
            glEnd()

class Triangle:
    def __init__(self, x, y, base, height, flipped=False):
        self.x = x
        self.y = y
        self.base = base
        self.height = height
        self.flipped = flipped
        self.passed = False 

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.base < 0

    def draw(self):
        self.draw_glow()
        glColor3f(0.2, 0.8, 0.4)  # Original triangle color
        # Triangle vertices
        if self.flipped:
            p1 = (self.x, self.y)  # Bottom-left vertex
            p2 = (self.x + self.base / 2, self.y - self.height)  # Top vertex
            p3 = (self.x + self.base, self.y)  # Bottom-right vertex
        else:
            p1 = (self.x, self.y)  # Bottom-left vertex
            p2 = (self.x + self.base / 2, self.y + self.height)  # Top vertex
            p3 = (self.x + self.base, self.y)  # Bottom-right vertex
      

        for x in range(int(p1[0]), int(p3[0]) + 1):  # Iterate through x-coordinates
        # Calculate y-bounds for each x-coordinate
            y_min = int(p1[1])
            if x <= p2[0]:
                y_max = int(p1[1] + (p2[1] - p1[1]) * (x - p1[0]) / (p2[0] - p1[0]))
            else:
                y_max = int(p1[1] + (p3[1] - p2[1]) * (x - p2[0]) / (p3[0] - p2[0]))
        # Draw points for the current column
        
            # for y in range(min(y_min, y_max), max(y_min, y_max) + 1):
            #     glVertex2f(x, y) #falty generation
        draw_line(p1[0], p1[1], p2[0], p2[1], color=(0.2, 0.8, 0.4))
        draw_line(p2[0], p2[1], p3[0], p3[1], color=(0.2, 0.8, 0.4))
        draw_line(p3[0], p3[1], p1[0], p1[1], color=(0.2, 0.8, 0.4))
     

    def draw_glow(self):
    # Draw multiple transparent layers to simulate a glow effect
        for i in range(20, 30):  # Increase the range for a larger glow
            alpha = 0.05 * (6 - i)  # Decrease alpha for outer layers
            scale = 1.0 + 0.1 * i  # Increase size for outer layers
            glColor4f(0.8, 0.8, 0.2, alpha)  # Yellowish glow with transparency
            if self.flipped:
               x1, y1 = self.x - scale, self.y + scale  # Bottom-left vertex
               x2, y2 = self.x + self.base / 2, self.y - self.height - scale  # Top vertex
               x3, y3 = self.x + self.base + scale, self.y + scale  # Bottom-right vertex
            else:
               x1, y1 = self.x - scale, self.y - scale  # Bottom-left vertex
               x2, y2 = self.x + self.base / 2, self.y + self.height + scale  # Top vertex
               x3, y3 = self.x + self.base + scale, self.y - scale  # Bottom-right vertex
            glBegin(GL_POINTS)
            for x in range(int(x1), int(x3) + 1):  # Iterate over the x-coordinates
                if x < x2:
                   y_start = int(y1)
                   y_end = int(y1 + (y2 - y1) * (x - x1) / (x2 - x1))  # Interpolate using slope
                else:
                   y_start = int(y1)
                   y_end = int(y1 + (y3 - y2) * (x - x2) / (x3 - x2))  # Interpolate using slope
            # Draw points for the current column
                for y in range(min(y_start, y_end), max(y_start, y_end) + 1):
                    glVertex2f(float(x), float(y))  # Draw each point
            glEnd()


def check_gap(new_x, existing_objects, width):
  
    for obj in existing_objects:
        if abs(new_x - obj.x) < min_gap:
            return False
    return True

def create_blocks():
    global blocks
    blocks = []
    x_positions = list(range(WINDOW_X, WINDOW_X + 400, min_gap + block_width))
    random.shuffle(x_positions)
    for x in x_positions[:max_blocks]:
        if check_gap(x, blocks + triangles, block_width):
            blocks.append(Block(x, ground_y))

def create_triangles():
    global triangles
    triangles = []
    x_positions = list(range(WINDOW_X, WINDOW_X + 400, min_gap + triangle_base))
    random.shuffle(x_positions)
    for x in x_positions[:max_triangles]:
        if check_gap(x, blocks + triangles, triangle_base):
            if random.choice([True, False]):
                triangles.append(Triangle(x, ground_y, triangle_base, triangle_height))  # Triangle on ground
            else:
                triangles.append(Triangle(x, ceiling_y, triangle_base, triangle_height, flipped=True))  # Triangle on ceiling

def update_blocks_and_triangles():
    global blocks, triangles, score

    # Move blocks and check if passed
    for block in blocks:
        block.move()
        if not block.passed and block.x + block.width < player_x - 25:  # Player passed the block
            block.passed = True
            score += 1

    # Remove blocks that are off-screen
    blocks = [block for block in blocks if not block.is_outside()]

    # Move triangles and check if passed
    for triangle in triangles:
        triangle.move()
        if not triangle.passed and triangle.x + triangle.base < player_x - 25:  # Player passed the triangle
            triangle.passed = True
            score += 1

    # Remove triangles that are off-screen
    triangles = [triangle for triangle in triangles if not triangle.is_outside()]

    # Spawn new blocks if needed
    if len(blocks) < max_blocks:
        x_positions = list(range(WINDOW_X, WINDOW_X + 400, min_gap + block_width))
        random.shuffle(x_positions)
        for x in x_positions:
            if check_gap(x, blocks + triangles, block_width):
                blocks.append(Block(x, ground_y))
                break

    # Spawn new triangles if needed
    if len(triangles) < max_triangles:
        x_positions = list(range(WINDOW_X, WINDOW_X + 400, min_gap + triangle_base))
        random.shuffle(x_positions)
        for x in x_positions:
            if check_gap(x, blocks + triangles, triangle_base):
                if random.choice([True, False]):
                    triangles.append(Triangle(x, ground_y, triangle_base, triangle_height))  # Ground triangle
                else:
                    triangles.append(Triangle(x, ceiling_y, triangle_base, triangle_height, flipped=True))  # Ceiling triangle
                break



def draw_line(x1, y1, x2, y2, color=(1.0, 1.0, 1.0)):
    MidpointLine(x1, y1, x2, y2, color)

def draw_platform():
    color = (1.0, 1.0, 1.0)
    draw_line(0, ground_y, WINDOW_X, ground_y, color)
    draw_line(0, ceiling_y, WINDOW_X, ceiling_y, color)

def draw_blocks():
    glColor3f(0.5, 0.2, 0.8)  # Block color
    for block in blocks:
        block.draw()

def draw_triangles():
    glColor3f(0.2, 0.8, 0.4)  # Triangle color
    for triangle in triangles:
        triangle.draw()




def init():
    glClearColor(0.0, 0.0, 0.0, 1.0)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    glOrtho(0.0, WINDOW_X, 0.0, WINDOW_Y, -1.0, 1.0)

    # Enable blending for transparency
    glEnable(GL_BLEND)
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)





# Initialize the game
create_blocks()
create_triangles()


def findzone(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    dx_squared = dx * dx
    dy_squared = dy * dy
    if dx >= 0:  
        if dy >= 0:  
            return 0 if dx_squared > dy_squared else 1
        else: 
            return 7 if dx_squared > dy_squared else 6
    else:  
        if dy >= 0:  
            return 3 if dx_squared > dy_squared else 2
        else:  
            return 4 if dx_squared > dy_squared else 5

def convert_to_zone0(x, y, original_zone):
    transformations = [(x, y),(y, x),(y, -x),(-x, y),(-x, -y),(-y, -x),(-y, x),(x, -y)]
    return transformations[original_zone]

def convert_to_original_zone(x, y, original_zone):
    transformations = [(x, y),(y, x),(-y, x),(-x, y),(-x, -y),(-y, -x),(y, -x),(x, -y)]
    return transformations[original_zone]

def drawpixel(x, y, original_zone):
    glPointSize(1)
    glBegin(GL_POINTS)
    glVertex2f(x, y)
    glEnd()

def MidpointLine(x1, y1, x2, y2, color):
    zone = findzone(x1, y1, x2, y2)
    x1, y1 = convert_to_zone0(x1, y1, zone)
    x2, y2 = convert_to_zone0(x2, y2, zone)
    glColor3f(*color)
    dx = x2 - x1
    dy = y2 - y1
    d = 2 * dy - dx
    i = 2 * dy
    j = 2 * (dy - dx)
    x = x1
    y = y1
    
    while x < x2:
        if d <= 0:
            d += i
            x += 1
        else:
            d += j
            x += 1
            y += 1
        original_x, original_y = convert_to_original_zone(x, y, zone)
        drawpixel(original_x, original_y, zone)

def draw_left_arrow():
    color = (0.8, 0.7, 0.0)
    MidpointLine(10, 580, 35, 580, color)
    MidpointLine(10, 580, 20, 590, color)
    MidpointLine(10, 580, 20, 570, color)
    
def draw_pause_symbol():
    color = (0.0, 1.0, 0.0)
    MidpointLine(10, 520, 10, 550, color)
    MidpointLine(35, 520, 35, 550, color)

def draw_play_symbol():
    color = (1.0, 0.65, 0.0)
    MidpointLine(10, 520, 10, 550, color)
    MidpointLine(35, 535, 10, 550, color)
    MidpointLine(35, 535, 10, 520, color)
    
def draw_cross():
    color = (1.0, 0.5, 0.5)
    MidpointLine(10, 500, 35, 475, color)
    MidpointLine(35, 500, 10, 475, color)

def draw_heart(x, y):
    color = (1.0, 0.0, 0.0)
    MidpointLine(x, y + 25, x + 12, y + 10, color)
    MidpointLine(x, y + 25, x + 6, y + 32, color)
    MidpointLine(x + 6, y + 32, x + 12, y + 25, color)
    MidpointLine(x + 24, y + 25, x + 18, y + 32, color)
    MidpointLine(x + 18, y + 32, x + 12, y + 25, color)
    MidpointLine(x + 12, y + 10, x + 24, y + 25, color)

def draw_text(text, x, y, color=(1.0, 1.0, 1.0)):
    glColor3f(*color)
    glRasterPos2f(x, y)
    for char in text:
        glutBitmapCharacter(GLUT_BITMAP_TIMES_ROMAN_24, ord(char))

def draw_score_box():
    color = (0.0, 0.0, 1.0)
    box_x1, box_y1 = 580, 580
    box_x2, box_y2 = 780, 550
    MidpointLine(box_x1, box_y1, box_x2, box_y1, color)
    MidpointLine(box_x1, box_y1, box_x1, box_y2, color)
    MidpointLine(box_x2, box_y1, box_x2, box_y2, color)
    MidpointLine(box_x1, box_y2, box_x2, box_y2, color)

    draw_text(f"Score: {score:.0f}", box_x1 + 10, box_y2 + 5)
 
def check_collision():

    global count, game_over, game_paused
    if not game_paused:


    # Check collision with blocks
        for block in blocks:
            if (player_x - 25 < block.x + block.width and
                player_x + 25 > block.x and
                player_y - 25 < block.y + block.height and
                player_y + 25 > block.y):
                count += 1  # Increment the collision count (lose a heart)
                blocks.remove(block)  # Remove the collided block
                if count >= 3:  # All hearts lost
                    game_over = True
                    game_paused = True
                    print("Game Over")
                return True
    
        # Check collision with triangles
        for triangle in triangles:
            if triangle.flipped:
                # Check collision for flipped triangle
                if (player_x - 25 < triangle.x + triangle.base and
                    player_x + 25 > triangle.x and
                    player_y - 25 < triangle.y and
                    player_y + 25 > triangle.y - triangle.height):
                    count += 1
                    triangles.remove(triangle)  # Remove the collided triangle
                    if count >= 3:
                        game_over = True
                        game_paused = True
                        print("Game Over")
                    return True
            else:
                # Check collision for normal triangle
                if (player_x - 25 < triangle.x + triangle.base and
                    player_x + 25 > triangle.x and
                    player_y - 25 < triangle.y + triangle.height and
                    player_y + 25 > triangle.y):
                    count += 1
                    triangles.remove(triangle)
                    if count >= 3:
                        game_over = True
                        game_paused = True
                        print("Game Over")
                    return True

def togglePause():
    global game_paused
    game_paused = not game_paused
    if game_paused:
        print("Game Paused")
    else:
        print("Game Resumed")

def restartGame():
    global game_over, score, count, game_paused, block_speed, blocks, triangles, player_x ,player_y ,velocity_y, high_score 
    print(f"Your Last Score: {score:.0f}")  
    print(f"Your Highest Score: {high_score:.0f}")   
    game_paused=False
    game_over = False
    count = 0
    glutPostRedisplay()
    player_x = 100  # Fixed horizontal position (for now)
    player_y = 225  # Initial vertical position (at the floor)
    velocity_y = 0  # Vertical velocity (used for jump physics)
    block_speed = 1
    blocks = []  # Reset blocks
    triangles = []  # Reset triangles
    score = 0  # Reset score
    game_paused = False  # Ensure the game is running

    glutPostRedisplay()  # Refresh the screen


def display():
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    global click, game_over, count, game_paused
    glClearColor(0.0, 0.0, 0.0, 0.0)  # Set background color

    if game_over:
        #glClearColor(1.0, 1.0, 1.0, 0.0)  # Game over screen background
        glClearColor(random.randint(0,1),random.randint(0,1),random.randint(0,1),random.randint(0,1)) 
    

    glClear(GL_COLOR_BUFFER_BIT)  # Clear buffers
    draw_platform()
    draw_blocks()
    draw_triangles()
    draw_player()

    # Draw game UI (hearts, pause, etc.)
    base_x = 600  # Starting x-position for hearts
    base_y = 510  # y-position below the score box
    spacing = 40  # Space between hearts

    if count == 0:  # Draw all three hearts
        draw_heart(base_x, base_y)
        draw_heart(base_x + spacing, base_y)
        draw_heart(base_x + 2 * spacing, base_y)
    elif count == 1:  # Draw two hearts
        draw_heart(base_x, base_y)
        draw_heart(base_x + spacing, base_y)
    elif count == 2:  # Draw one heart
        draw_heart(base_x, base_y)
    
    draw_left_arrow()
    draw_pause_symbol() if not game_paused else draw_play_symbol()
    draw_cross()
    draw_score_box()

    glutSwapBuffers()  # Swap buffers for double buffering





def animate():
    global block_speed, game_paused, game_over, show_start_screen
    if not game_paused and not game_over and not show_start_screen:
        update_blocks_and_triangles()
        update_player()

        # Gradually increase the speed, but cap it at max_speed
        if block_speed < max_speed:
            block_speed += speed_increment
        

        glutPostRedisplay()


def mouseClick(button, state, x, y):
    global game_over, game_paused, click, score

    if button == GLUT_LEFT_BUTTON and state == GLUT_DOWN:
        if 10 <= x <= 35 and 10 <= y <= 30: 
            print("Starting over!")
            restartGame()

        elif 10 <= x <= 35 and 50 <= y <= 80: 
            togglePause()

        elif 10 <= x <= 35 and 100 <= y <= 125:  
            print("Goodbye!")
            print(f"Your Total Score is {score:.0f}!")
            glutLeaveMainLoop()
        glutPostRedisplay()


player_x = 100  # Fixed horizontal position (for now)
player_y = 225  # Initial vertical position (at the floor)
velocity_y = 0  # Vertical velocity (used for jump physics)
jump_velocity = 10  # Initial velocity when the player jumps
is_jumping = False  # Whether the player is in the air
on_floor= True
on_ceiling= False

# Keyboard function to handle spacebar for jumping
def keyboard(key, x, y):
    global velocity_y, is_jumping, on_floor, on_ceiling

    if key == b' ' and not is_jumping and not on_ceiling:  # When spacebar is pressed and not already jumping
        velocity_y = jump_velocity  # Start the upward velocity for jumping
        is_jumping = True  # Player starts jumping
        on_floor = False
        on_ceiling = True
    if key == b' ' and not is_jumping and not on_floor:  # When spacebar is pressed and not already jumping
        velocity_y = -jump_velocity  # Start the downward velocity for jumping
        is_jumping = True  # Player starts jumping
        on_floor = True
        on_ceiling = False    


def special_keyboard(key, x, y):
    global player_x, block_speed, game_paused
    if not game_paused:

         step = 10  # Step size 

         if key == GLUT_KEY_LEFT:  
             player_x -= step
             if player_x < 0: 
                 player_x = 0
         elif key == GLUT_KEY_RIGHT:  
             player_x += step
             if player_x > WINDOW_X:  
                 player_x = WINDOW_X - 50 
         elif key == GLUT_KEY_UP:
             block_speed+=1 
         elif key == GLUT_KEY_DOWN:
             block_speed-=1 


def update_player():
    global player_y, velocity_y, is_jumping, player_x, game_paused, show_start_screen, game_over, score, high_score
    if score>high_score:
     high_score= score 

    if not game_paused and not show_start_screen and not game_over:
        

        # Apply gravity if the player is jumping (not touching the ground or ceiling)
        if is_jumping:
            score+=0.05
            player_y += velocity_y  # Update player position based on velocity
            player_x += 3

        # Check if the player has reached the ceiling
        if player_y >= 375:
            player_y = 375  # Clamp to ceiling
            velocity_y = 0  # Stop upward movement
            is_jumping = False  # Stop jumping
            player_x -= 0.3

        # Check if the player has reached the floor
        if player_y <= 225:
            player_y = 225  # Clamp to floor
            velocity_y = 0  # Stop downward movement
            is_jumping = False  # Stop jumping
            player_x -= 0.1
            
        if check_collision():
           if not game_paused:  
                if count < 3:  # Only print the collision message if hearts are still left
                   print(f"Collision detected! Hearts left: {3 - count}")
                if count >= 3:  # No hearts left
                   game_paused = True
                   glutDisplayFunc(display_start_screen)
                   glutMouseFunc(mouse_click_start_screen)
                   restartGame()
def draw_player():
    def midpoint_circle(radius):
    
        x = 0
        y = radius
        d = 1 - radius
        plot_circle_points(x, y)  
        while x < y:
            if d < 0:
                d = d + 2 * x + 3
            else:
                d = d + 2 * (x - y) + 5
                y -= 1
            x += 1
            plot_circle_points(x, y)

    def plot_circle_points(x, y):
     
        glBegin(GL_POINTS)
        # Plot points for all octants
        glVertex2f(player_x + x, player_y + y)  # Octant 1
        glVertex2f(player_x - x, player_y + y)  # Octant 2
        glVertex2f(player_x + x, player_y - y)  # Octant 3
        glVertex2f(player_x - x, player_y - y)  # Octant 4
        glVertex2f(player_x + y, player_y + x)  # Octant 5
        glVertex2f(player_x - y, player_y + x)  # Octant 6
        glVertex2f(player_x + y, player_y - x)  # Octant 7
        glVertex2f(player_x - y, player_y - x)  # Octant 8
        glEnd()

    glPushMatrix()
    glColor3f(random.randint(0,1), random.randint(0,1),random.randint(0,1) )  
    midpoint_circle(25)
    midpoint_circle(24)
    midpoint_circle(23)
    midpoint_circle(22)
    midpoint_circle(21)
    midpoint_circle(20)
    midpoint_circle(15)
    midpoint_circle(14)
    midpoint_circle(13)
    midpoint_circle(12)
    midpoint_circle(11)
    midpoint_circle(10)
    midpoint_circle(5)
    midpoint_circle(4)
    midpoint_circle(3)
    midpoint_circle(2)
    midpoint_circle(1)
    glPopMatrix()


def update(value):
    global score, high_score
    update_player() 

    glutPostRedisplay()  # Redraw the scene
    glutTimerFunc(16, update, 0)
      # Continue the update loop

def main():
    global show_start_screen, game_paused, score, high_score



    glutInit(sys.argv)
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)
    glutInitWindowSize(WINDOW_X, WINDOW_Y)
    glutCreateWindow(b"Geo Dash Mini")
    init()

    glutDisplayFunc(display_start_screen if show_start_screen else display)
    glutMouseFunc(mouse_click_start_screen)
    glutKeyboardFunc(keyboard)
    glutSpecialFunc(special_keyboard) 
    glutIdleFunc(animate)
    glutTimerFunc(16, update, 0)
    glutMainLoop()


    glutMainLoop()




if __name__ == "__main__":
    main()
