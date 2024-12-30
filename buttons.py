from OpenGL.GL import *
from OpenGL.GLU import *
from OpenGL.GLUT import *

WINDOW_X = 800
WINDOW_Y = 600

show_start_screen = True

game_paused = False
game_over = False
click = False
score = 0
count = 0

def draw_text_centered(text, x, y, color=(1.0, 1.0, 1.0)):
    glColor3f(*color)
    length = len(text) * 9  
    glRasterPos2f(x - length // 2, y)
    for char in text:
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, ord(char))

def display_start_screen():
    glClearColor(0.0, 0.0, 0.0, 0.0)  
    glClear(GL_COLOR_BUFFER_BIT)
    draw_text_centered("Welcome to Geo Dash-Mini !!!", 400, 410, color=(1.0, 1.0, 0.0))

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
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, ord(char))

def draw_score_box():
    color = (0.0, 0.0, 1.0)
    box_x1, box_y1 = 580, 580
    box_x2, box_y2 = 780, 550
    MidpointLine(box_x1, box_y1, box_x2, box_y1, color)
    MidpointLine(box_x1, box_y1, box_x1, box_y2, color)
    MidpointLine(box_x2, box_y1, box_x2, box_y2, color)
    MidpointLine(box_x1, box_y2, box_x2, box_y2, color)

    draw_text(f"Score: {score}", box_x1 + 10, box_y2 + 5)

def togglePause():
    global game_paused
    game_paused = not game_paused
    if game_paused:
        print("Game Paused")
    else:
        print("Game Resumed")

def restartGame():
    global game_over, score, count, game_paused
    print(f" Previous Score: {score}")    
    game_paused=False
    game_over = False
    score = 0
    count = 0
    glutPostRedisplay()

def display():
    global click, game_over, count

    if game_over:
        glClearColor(1.0, 1.0, 1.0, 0.0)

    else:
        glClearColor(0.0, 0.0, 0.0, 0.0)  

    glClear(GL_COLOR_BUFFER_BIT)

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
    if not game_paused:
        draw_pause_symbol()
    else:
        draw_play_symbol() 
    draw_cross()

    draw_score_box()

    glutSwapBuffers()

def mouseClick(button, state, x, y):
    global game_over, game_paused, click

    if button == GLUT_LEFT_BUTTON and state == GLUT_DOWN:

        glutPostRedisplay()
        
        if 10 <= x <= 35 and 10 <= y <= 30: 
            print("Starting over!")
            restartGame()

        elif 10 <= x <= 35 and 50 <= y <= 80: 
            togglePause()

        elif 10 <= x <= 35 and 100 <= y <= 125:  
            print("Goodbye!")
            glutLeaveMainLoop()

def main():
    glutInit()
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)
    glutInitWindowSize(WINDOW_X, WINDOW_Y)
    glutCreateWindow(b"423 Project")
    gluOrtho2D(0, WINDOW_X, 0, WINDOW_Y)

    if show_start_screen:
        glutDisplayFunc(display_start_screen)
        glutMouseFunc(mouse_click_start_screen)
    else:
        glutDisplayFunc(display)
        glutMouseFunc(mouseClick)

    glutMainLoop()

if __name__ == "__main__":
    main()
